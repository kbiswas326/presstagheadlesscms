import { BsNutFill } from "react-icons/bs";

export async function getLayoutStructure(url) {

  const mainUrl=process.env.NEXT_PUBLIC_API_URL? `${process.env.NEXT_PUBLIC_API_URL}/structure` :`https://dev.sportzpoint.com/structure`
  try {
    const response = await fetch(mainUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { 
        revalidate: 120 // Cache for 1 minute (60 seconds)
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch layout structure: ${response.status} ${response.statusText}`);
      return getDefaultStructure();
    }
    
    const data = await response.json();
    
    // Validate data structure
    if (!data || Object.keys(data).length === 0) {
      console.warn('Received empty layout structure');
      return getDefaultStructure();
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching layout structure:', error);
    return getDefaultStructure();
  }
}
function getDefaultStructure() {
  return {
    navbar: [
      {
        icon: null,
        label: 'Home',
        slug: 'home'
      }
    ],
    html_head: [],
    featuredCategory: [
      {
        icon: null,
        label: 'Sports',
        slug: 'sports'
      }
    ],
    homePageLayout: [
      {
        category: {
          label: 'Default',
          slug: 'default'
        },
        tag: {
          label: 'General',
          slug: 'general'
        }
      }
    ],
    all_cat_tag: {
      section_card: {
        before: null,
        after: null
      },
      card_add: []
    },
    top_nav: null,
    after_nav: null,
    before_home_body: null,
    after_home_body: null,
    before_latest_post: null,
    after_latest_post: null,
    before_featured_category: null,
    after_featured_category: null,
    category_page: [
      {
        slug: '/',
        section_card: {
          before: null,
          after: null
        },
        card_add: []
      }
    ],
    home_page: {
      article_card: {
        before: null,
        after: null
      },
      card_add: []
    },
    blog_post: {
      after_banner: null,
      before_banner: null,
      after_content: null,
    }
  };
}