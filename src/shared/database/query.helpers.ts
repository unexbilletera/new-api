export class QueryHelpers {
  static buildWhereClause<T extends Record<string, any>>(
    filters: T,
    mapping?: Record<keyof T, string | ((value: any) => any)>,
  ): any {
    const where: any = {};

    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') continue;

      const mappedKey = mapping?.[key as keyof T] || key;

      if (typeof mappedKey === 'function') {
        Object.assign(where, mappedKey(value));
      } else {
        where[mappedKey] = value;
      }
    }

    return where;
  }

  static buildRangeQuery<T>(
    minValue?: T,
    maxValue?: T,
  ): { gte?: T; lte?: T } | undefined {
    const range: { gte?: T; lte?: T } = {};
    if (minValue !== undefined) range.gte = minValue;
    if (maxValue !== undefined) range.lte = maxValue;
    return Object.keys(range).length > 0 ? range : undefined;
  }

  static buildSearchQuery(
    searchTerm: string,
    fields: string[],
  ): Record<'OR', any[]> {
    return {
      OR: fields.map((field) => ({
        [field]: { contains: searchTerm, mode: 'insensitive' },
      })),
    };
  }

  static mergeConditions(...conditions: any[]): { AND: any[] } | any {
    const filtered = conditions.filter((c) => c && Object.keys(c).length > 0);
    return filtered.length > 0 ? { AND: filtered } : {};
  }

  static buildInCondition<T>(values: T[]): { in: T[] } | undefined {
    return values && values.length > 0 ? { in: values } : undefined;
  }

  static buildNotInCondition<T>(values: T[]): { notIn: T[] } | undefined {
    return values && values.length > 0 ? { notIn: values } : undefined;
  }

  static buildLikeCondition(value: string): {
    contains: string;
    mode: 'insensitive';
  } {
    return {
      contains: value,
      mode: 'insensitive',
    };
  }
}
