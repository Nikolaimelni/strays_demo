export const Alert = ({ children }: { children: string }) => (
  <p role="alert" className="border-l-2 border-danger py-1 pl-3 text-sm text-danger">
    {children}
  </p>
);
