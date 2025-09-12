// Test file for Git hooks - intentionally poorly formatted
export const testFunction = (a: number, b: string) => {
  const result = {
    value: a,
    message: b,
    timestamp: new Date().toISOString(),
  };
  return result;
};

export const anotherFunction = () => {
  console.log('This has inconsistent formatting');
  console.log('Mixed indentation');
};
