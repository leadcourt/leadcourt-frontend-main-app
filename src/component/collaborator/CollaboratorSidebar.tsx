import { useEffect, useMemo, useRef, useState } from "react";
import menu from "../../utils/menuLinks.json";
import { Link, useLocation, useParams } from "react-router-dom";
import logo from "../../assets/logo/logo.png";
import logoSmall from "../../assets/logo/logoSmall.png";

type SubLink = { text: string; link: string };
type MenuLink = { text: string; img?: string; link?: string; sub?: SubLink[] };

type CollaboratorSidebarProps = {
  forceExpanded?: boolean;
  onRequestClose?: () => void;
  className?: string;
};

const stripTrailing = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);

const join = (a: string, b: string) => {
  const A = stripTrailing(a);
  const B = b.replace(/^\/+/, "");
  return stripTrailing(`${A}/${B}`);
};

export default function CollaboratorSidebar({
  forceExpanded,
  onRequestClose,
  className = "",
}: CollaboratorSidebarProps) {
  const { collaborationId } = useParams();
  const location = useLocation();

  const base = collaborationId ? `/collaboration/${collaborationId}` : "/collaboration";

  const resolveTo = (l?: string | null) => {
    if (!l || l === "#") return null;
    // already absolute
    if (l.startsWith("/")) return stripTrailing(l);
    // relative -> under collaboration base
    return join(base, l);
  };

  const findActiveParent = (links: MenuLink[], path: string) => {
    let best:
      | {
          text: string;
          matchLen: number;
          hasSub: boolean;
        }
      | null = null;

    const p = stripTrailing(path);

    for (const m of links) {
      const candidates: string[] = [];

      const parent = resolveTo(m.link ?? null);
      if (parent) candidates.push(parent);

      for (const s of m.sub ?? []) {
        const sub = resolveTo(s.link ?? null);
        if (sub) candidates.push(sub);
      }

      for (const l of candidates) {
        const isMatch = p === l || p.startsWith(`${l}/`);
        if (isMatch) {
          const len = l.length;
          if (!best || len > best.matchLen) {
            best = { text: m.text, matchLen: len, hasSub: (m.sub ?? []).length > 0 };
          }
        }
      }
    }

    // keep this if you ever show settings in collab routes
    if (p.startsWith("/user/setting")) return { text: "Settings", matchLen: 999, hasSub: false };

    return best;
  };

  const [menuItem, setMenuItem] = useState<string | null>(null);
  const [menuItemDrop, setMenuItemDrop] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const menuList = useMemo(() => menu[1] as { role: string; links: MenuLink[] }, []);
  const expanded = forceExpanded ? true : sidebarExpanded;

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  const handleEnter = () => {
    if (forceExpanded) return;
    clearCloseTimer();
    setSidebarExpanded(true);
  };

  const handleLeave = () => {
    if (forceExpanded) return;
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setSidebarExpanded(false), 120);
  };

  const maybeCloseDrawer = () => {
    if (forceExpanded) onRequestClose?.();
  };

  const dropMenuItem = (text: string, hasSub: boolean) => {
    setMenuItem((prev) => {
      if (prev === text) setMenuItemDrop((d) => !d);
      else setMenuItemDrop(hasSub);
      return text;
    });
  };

  useEffect(() => {
    const active = findActiveParent(menuList.links, location.pathname);
    if (active) {
      setMenuItem(active.text);
      setMenuItemDrop(active.hasSub);
    } else {
      setMenuItem(menuList.links[0]?.text ?? null);
      setMenuItemDrop(false);
    }
  }, [location.pathname, menuList.links, base]);

  const headerH = "h-20";

  return (
    <aside
      className={`h-screen bg-white border-r border-gray-200 shadow-sm z-40 flex flex-col transition-[width] duration-300 ease-in-out will-change-[width] lg:sticky lg:top-0 lg:self-start ${
        expanded ? "w-64" : "w-20"
      } ${className}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div className={`${headerH} flex items-center justify-center border-b border-gray-200`}>
        <Link to={base} className="flex items-center justify-center w-full" onClick={maybeCloseDrawer}>
          <img
            src={expanded ? logo : logoSmall}
            alt="LeadCourt"
            className={`object-contain transition-all ${expanded ? "h-12 w-auto" : "h-8 w-10"}`}
          />
        </Link>
      </div>

      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        {menuList.links.map((item, index) => {
          const active = menuItem === item.text;
          const hasSub = !!item.sub?.length;

          const to = resolveTo(item.link ?? null) ?? "#";

          return (
            <div key={`${item.text}-${index}`} className="mb-2">
              <Link
                to={to as any}
                onClick={() => {
                  dropMenuItem(item.text, hasSub);
                  if (!hasSub) maybeCloseDrawer();
                }}
                className="block"
              >
                <div
                  className={`flex items-center h-12 px-4 rounded-lg cursor-pointer transition-all ${
                    active
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <i className={`pi ${item.img ?? ""} text-lg`} />
                  {expanded && <span className="ml-4 text-sm font-medium whitespace-nowrap">{item.text}</span>}
                  {expanded && hasSub && (
                    <i
                      className={`pi ml-auto text-xs opacity-70 ${
                        active && menuItemDrop ? "pi-chevron-down" : "pi-chevron-right"
                      }`}
                    />
                  )}
                </div>
              </Link>

              {expanded && hasSub && active && menuItemDrop && (
                <div className="mt-2 pl-12 flex flex-col gap-2">
                  {item.sub!.map((s, sIdx) => {
                    const subTo = resolveTo(s.link ?? null) ?? "#";
                    const isSubActive =
                      subTo !== "#" &&
                      (stripTrailing(location.pathname) === subTo ||
                        stripTrailing(location.pathname).startsWith(`${subTo}/`));

                    return (
                      <Link
                        key={`${s.text}-${sIdx}`}
                        to={subTo as any}
                        onClick={maybeCloseDrawer}
                        className={`text-sm transition-colors ${
                          isSubActive ? "text-orange-600 font-semibold" : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        {s.text}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}