/// admin> app> layout.js | Root layout component for the Presstag admin dashboard. This component sets up the overall structure of the admin interface, including global styles, context providers for user and theme management, and a toaster for notifications. It wraps the main content of the admin pages with a consistent layout and styling, ensuring a cohesive user experience across all admin pages. The layout also includes support for dark mode and responsive design to enhance usability on different devices. //
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { UserProvider } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";
import LayoutContent from "./LayoutContent";

export const metadata = {
  title: "CMS Dashboard",
  description: "CMS Dashboard Layout",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 dark:bg-gray-900 h-screen overflow-hidden flex transition-colors duration-300">
        <ThemeProvider>
          <UserProvider>
            <LayoutContent>{children}</LayoutContent>
            <Toaster position="top-right" />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}