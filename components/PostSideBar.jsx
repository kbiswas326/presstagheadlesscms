'use client';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CiVideoOn } from "react-icons/ci";
import { RiArticleLine } from "react-icons/ri";
import { 
  BsBook, 
  BsImages, 
  BsBroadcastPin,
  BsClockHistory,
  BsChevronLeft
} from 'react-icons/bs';
import { AiOutlinePlus } from 'react-icons/ai';
import { usePathname } from 'next/navigation';
import useSidebarStore from '../store/useSidebarStore';

const contentTypes = [
  {
    name: 'Article',
    href: '/posts/article',
    icon: <RiArticleLine className="text-lg" />,
    description: 'Create a new article post'
  },
  {
    name: 'Video',
    href: '/posts/video',
    icon: <CiVideoOn className="text-lg" />,
    description: 'Upload a new video post'
  },
  {
    name: 'Web Story',
    href: '/posts/web-story',
    icon: <BsBook className="text-lg" />,
    description: 'Create an engaging web story'
  },
  {
    name: 'Photo Gallery',
    href: '/posts/photo-gallery',
    icon: <BsImages className="text-lg" />,
    description: 'Create a photo gallery'
  },
  {
    name: 'Live Blog',
    href: '/posts/live-blog',
    icon: <BsBroadcastPin className="text-lg" />,
    description: 'Start a live blog'
  },
  {
    name: 'Quiz',
    href: '/posts/quiz',
    icon: <BsBroadcastPin className="text-lg" />,
    description: 'Quiz section'
  }
];

const PostSideBar = () => {
  const pathname = usePathname();
  const { showPostSidebar, togglePostSidebar } = useSidebarStore();

  return (
    <AnimatePresence>
      {showPostSidebar && (
        <motion.div
          className="w-full bg-white h-screen shadow-sm border-r border-gray-100 px-4 py-6 z-45 overflow-hidden"
          initial={{ width: 0, opacity: 0 }}
          animate={{ 
            width: "100%", 
            opacity: 1,
            transition: {
              width: { duration: 0.2, ease: 'easeInOut' },
              opacity: { duration: 0.1, ease: 'easeInOut' }
            }
          }}
          exit={{ 
            width: 0, 
            opacity: 0,
            transition: {
              width: { duration: 0.2, ease: 'easeInOut' },
              opacity: { duration: 0.1, delay: 0.1, ease: 'easeInOut' }
            }
          }}
        >
          <div className="h-full overflow-y-auto">
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Content</h2>
                <p className="text-sm text-gray-500">Create and manage your content</p>
              </div>
              <button
                onClick={() => togglePostSidebar(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close sidebar"
              >
                <BsChevronLeft className="text-xl" />
              </button>
            </div>

            {/* Content Type Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3 px-2">New Content</h3>
                <div className="space-y-1">
                  {contentTypes.map((contentType) => {
                    const isActive = pathname.startsWith(contentType.href);
                    return (
                      <Link
                        key={contentType.name}
                        href={contentType.href}
                        className={`
                          flex items-center justify-between p-2 rounded-lg transition-all duration-200 group
                          ${isActive 
                            ? 'bg-blue-50 text-blue-600' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            p-2 rounded-md transition-colors duration-200
                            ${isActive 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                            }
                          `}>
                            {contentType.icon}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{contentType.name}</div>
                            <div className="text-xs text-gray-500">{contentType.description}</div>
                          </div>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`
                            p-1 rounded-md transition-colors duration-200
                            ${isActive 
                              ? 'text-blue-600' 
                              : 'text-gray-400 group-hover:text-gray-600'
                            }
                          `}
                        >
                          <AiOutlinePlus />
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Recent Section */}
              {/* <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3 px-2">Recent</h3>
                <div className="space-y-1">
                  <Link 
                    href="#" 
                    className="flex items-center gap-3 p-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  >
                    <div className="p-2 rounded-md bg-gray-100 text-gray-500">
                      <BsClockHistory className="text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">IPL 2024: Match Preview</div>
                      <div className="text-xs text-gray-500">Article • 2 hours ago</div>
                    </div>
                  </Link>
                </div>
              </div> */}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PostSideBar;
