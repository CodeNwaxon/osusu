import Link from "next/link";
import { FaTwitter, FaInstagram, FaFacebookF, FaLinkedinIn } from "react-icons/fa";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-card">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
                <img src="/osusu_logo2.png" alt="site logo" className="h-9 w-9 rounded-full object-cover" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                Osusu
              </span>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
              Empowering communities through transparent, secure group contributions. Built for Nigeria, trusted by thousands.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/create-group" className="hover:text-foreground transition-colors">Create a Group</Link></li>
              <li><Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
              <li><Link href="/" className="hover:text-foreground transition-colors">Discover Groups</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Osusu. All rights reserved. Made with ❤️ in Nigeria.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
              className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all">
              <FaTwitter className="h-4 w-4" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
              className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all">
              <FaInstagram className="h-4 w-4" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
              className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all">
              <FaFacebookF className="h-4 w-4" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
              className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all">
              <FaLinkedinIn className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
