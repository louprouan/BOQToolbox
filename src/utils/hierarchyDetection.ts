export interface HierarchyPattern {
  pattern: RegExp;
  level: number;
  description: string;
}

export class AIHierarchyDetector {
  private patterns: HierarchyPattern[] = [
    // Level 1: Major sections (1, 2, 3, A, B, C)
    { pattern: /^[A-Z]$|^[1-9]$/, level: 1, description: 'Major section' },
    { pattern: /^[A-Z]\.$|^[1-9]\.$/, level: 1, description: 'Major section with dot' },
    
    // Level 2: Sub-sections (1.1, 1.2, A.1, A.2)
    { pattern: /^[A-Z]\.[1-9]$|^[1-9]\.[1-9]$/, level: 2, description: 'Sub-section' },
    { pattern: /^[A-Z]\.[1-9]\.$|^[1-9]\.[1-9]\.$/, level: 2, description: 'Sub-section with dot' },
    
    // Level 3: Sub-sub-sections (1.1.1, 1.2.3, A.1.1)
    { pattern: /^[A-Z]\.[1-9]\.[1-9]$|^[1-9]\.[1-9]\.[1-9]$/, level: 3, description: 'Sub-sub-section' },
    { pattern: /^[A-Z]\.[1-9]\.[1-9]\.$|^[1-9]\.[1-9]\.[1-9]\.$/, level: 3, description: 'Sub-sub-section with dot' },
    
    // Level 4: Detailed items (1.1.1.1, A.1.1.1)
    { pattern: /^[A-Z]\.[1-9]\.[1-9]\.[1-9]$|^[1-9]\.[1-9]\.[1-9]\.[1-9]$/, level: 4, description: 'Detailed item' },
    
    // Level 5: Very detailed items (1.1.1.1.1)
    { pattern: /^[1-9]\.[1-9]\.[1-9]\.[1-9]\.[1-9]$/, level: 5, description: 'Very detailed item' },
    
    // Alternative patterns with letters
    { pattern: /^[1-9][a-z]$/, level: 2, description: 'Numbered with letter suffix' },
    { pattern: /^[1-9]\.[1-9][a-z]$/, level: 3, description: 'Sub-section with letter' },
    
    // Roman numerals
    { pattern: /^[IVX]+$/, level: 1, description: 'Roman numeral section' },
    { pattern: /^[IVX]+\.[1-9]$/, level: 2, description: 'Roman numeral sub-section' },
  ];

  private subtotalKeywords = [
    'subtotal', 'sub-total', 'sub total', 'total', 'sum', 'carry forward',
    'brought forward', 'section total', 'chapter total', 'group total'
  ];

  detectHierarchy(itemCode: string, description: string): { level: number; isSubtotal: boolean } {
    // Clean the item code
    const cleanCode = itemCode.trim().toUpperCase();
    
    // Check for subtotal indicators
    const isSubtotal = this.isSubtotalItem(description, itemCode);
    
    // Try to match against known patterns
    for (const pattern of this.patterns) {
      if (pattern.pattern.test(cleanCode)) {
        return {
          level: pattern.level,
          isSubtotal
        };
      }
    }
    
    // Fallback: analyze structure
    const level = this.analyzeStructure(cleanCode);
    
    return {
      level: Math.max(1, level),
      isSubtotal
    };
  }

  private isSubtotalItem(description: string, itemCode: string): boolean {
    const lowerDesc = description.toLowerCase();
    const lowerCode = itemCode.toLowerCase();
    
    // Check description for subtotal keywords
    const hasSubtotalKeyword = this.subtotalKeywords.some(keyword => 
      lowerDesc.includes(keyword)
    );
    
    // Check if item code suggests subtotal (often empty or special format)
    const hasSubtotalCode = lowerCode === '' || lowerCode === '-' || lowerCode.includes('total');
    
    return hasSubtotalKeyword || hasSubtotalCode;
  }

  private analyzeStructure(code: string): number {
    // Count dots and other separators to determine level
    const dotCount = (code.match(/\./g) || []).length;
    const dashCount = (code.match(/-/g) || []).length;
    const spaceCount = (code.match(/\s/g) || []).length;
    
    // Base level calculation
    let level = 1;
    
    if (dotCount > 0) {
      level = dotCount + 1;
    } else if (dashCount > 0) {
      level = dashCount + 1;
    } else if (spaceCount > 0) {
      level = Math.min(spaceCount + 1, 5);
    }
    
    // Additional heuristics
    if (code.length > 10) level = Math.min(level + 1, 5);
    if (/[a-z]/.test(code)) level = Math.max(level, 2);
    
    return Math.min(level, 5); // Cap at level 5
  }

  processBoQData(items: any[]): any[] {
    const processedItems = items.map((item, index) => {
      const hierarchy = this.detectHierarchy(item.itemCode || '', item.description || '');
      
      return {
        ...item,
        id: item.id || `item-${index}`,
        hierarchyLevel: hierarchy.level,
        isSubtotal: hierarchy.isSubtotal,
        itemCode: item.itemCode || `ITEM-${String(index + 1).padStart(3, '0')}`,
        description: item.description || `Item ${index + 1}`,
        unit: item.unit || 'unit',
        quantity: typeof item.quantity === 'number' ? item.quantity : 1,
        bidderRates: item.bidderRates || {},
        bidderTotals: item.bidderTotals || {}
      };
    });

    // Calculate subtotals and parent relationships
    return this.calculateSubtotals(processedItems);
  }

  private calculateSubtotals(items: any[]): any[] {
    const result = [...items];
    
    // Group items by hierarchy and calculate subtotals
    for (let i = 0; i < result.length; i++) {
      const item = result[i];
      
      if (item.isSubtotal) {
        // Find all items that should be included in this subtotal
        const subtotalItems = this.findSubtotalItems(result, i);
        
        // Calculate totals for each bidder
        Object.keys(item.bidderRates || {}).forEach(bidder => {
          const subtotalAmount = subtotalItems.reduce((sum, subItem) => {
            return sum + (subItem.bidderTotals[bidder] || 0);
          }, 0);
          
          item.bidderTotals[bidder] = subtotalAmount;
          item.bidderRates[bidder] = item.quantity > 0 ? subtotalAmount / item.quantity : 0;
        });
      }
    }
    
    return result;
  }

  private findSubtotalItems(items: any[], subtotalIndex: number): any[] {
    const subtotalItem = items[subtotalIndex];
    const subtotalLevel = subtotalItem.hierarchyLevel;
    const result = [];
    
    // Look backwards from subtotal to find related items
    for (let i = subtotalIndex - 1; i >= 0; i--) {
      const item = items[i];
      
      // Stop if we hit another subtotal at same or higher level
      if (item.isSubtotal && item.hierarchyLevel <= subtotalLevel) {
        break;
      }
      
      // Include items at higher detail level
      if (item.hierarchyLevel > subtotalLevel && !item.isSubtotal) {
        result.unshift(item);
      }
    }
    
    return result;
  }

  getHierarchyFormatting(level: number, isSubtotal: boolean) {
    const baseStyles = {
      1: { 
        fontWeight: 'bold', 
        fontSize: '16px', 
        backgroundColor: '#f0f9ff', 
        borderTop: '2px solid #008080',
        paddingLeft: '8px'
      },
      2: { 
        fontWeight: '600', 
        fontSize: '14px', 
        backgroundColor: '#f8fafc', 
        borderTop: '1px solid #cbd5e1',
        paddingLeft: '16px'
      },
      3: { 
        fontWeight: '500', 
        fontSize: '13px', 
        backgroundColor: '#fafafa',
        paddingLeft: '24px'
      },
      4: { 
        fontWeight: 'normal', 
        fontSize: '12px',
        paddingLeft: '32px'
      },
      5: { 
        fontWeight: 'normal', 
        fontSize: '11px', 
        fontStyle: 'italic',
        paddingLeft: '40px'
      }
    };

    const subtotalStyles = {
      fontWeight: 'bold',
      backgroundColor: '#e0f2f1',
      borderTop: '2px solid #008080',
      borderBottom: '1px solid #008080',
      color: '#004d40'
    };

    const levelStyle = baseStyles[level as keyof typeof baseStyles] || baseStyles[5];
    
    return isSubtotal ? { ...levelStyle, ...subtotalStyles } : levelStyle;
  }
}