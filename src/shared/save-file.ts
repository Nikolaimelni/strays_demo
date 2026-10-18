// a blob behind a throwaway link: the only way to hand somebody a file the page built
// itself without a server in the middle
export const saveFile = (name: string, contents: string, type: string) => {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};
