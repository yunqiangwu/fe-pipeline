import React from 'react';

const UseContainers = ({ children }: any) => {
  return (
    <>
      {children}
    </>
  );
};

export function rootContainer(container: any) {
  return React.createElement(UseContainers, null, container);
}
