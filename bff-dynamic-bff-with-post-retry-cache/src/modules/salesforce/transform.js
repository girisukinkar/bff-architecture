/**
 * Map raw Salesforce REST shape to our GraphQL shape.
 */
export function toAccount(g) {
  return {
    id: g.Id,
    name: g.Name,
    industry: g.Industry
  };
}
