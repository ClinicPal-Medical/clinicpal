/**
 * Full-screen overlay layout for the examine page.
 * position:fixed + inset-0 + z-[100] covers the staff sidebar entirely,
 * giving the doctor a distraction-free clinical workspace.
 */
export default function ExamineLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto flex flex-col">
      {children}
    </div>
  );
}
