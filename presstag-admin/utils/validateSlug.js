export const validateSlug=(slug)=> {
    // Regular expression to find invalid characters
    const invalidCharRegex = /[^a-zA-Z0-9-]/;
  
    const match = slug.match(invalidCharRegex);
    if (match) {
     
      return false; // Invalid slug
    }
  
    return true; // Valid slug
  }