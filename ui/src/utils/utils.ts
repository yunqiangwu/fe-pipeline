


export const windowOpen = async (wsUrl: any) => {

  if (!wsUrl) {
    return;
  }

  console.log(wsUrl);

  // await new Promise((resolve) => { setTimeout(() => resolve(null), 500)});
  const a = document.createElement('a');
  a.href = wsUrl;
  a.target = '_blank';
  document.body.appendChild(a);

  setTimeout(() => {
    a.click();
    setTimeout(() => {
      a.remove();
    }, 0);
  }, 200);

}

