import "./globals.css";
import { UserProvider } from "context/UserContext";
import { ThemeProvider } from "context/ThemeContext";
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
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
