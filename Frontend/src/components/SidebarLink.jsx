export default function SidebarLink({ icon, label, active, onClick, to }) {
  return (
    <button
      onClick={onClick}
      className={active ? 'sidebar-link-active w-full text-left' : 'sidebar-link w-full text-left'}
    >
      {icon}
      {label}
    </button>
  );
}
