// @ts-nocheck


(() => {
  // Runtime block add component
  window.GUmiUIFlag = require('C:/Users/q2320/workspace/fe-pipeline/samples/hzero-app2/node_modules/hzero-cli-plugin-ui-blocks/lib/sdk/flagBabelPlugin/GUmiUIFlag.js').default;

  window.CORAL_UI_URL = 'http://localhost:3358';

  // Enable/Disable block add edit mode
  window.addEventListener('message', (event) => {
    try {
      const { action, data } = JSON.parse(event.data);
      switch (action) {
        case 'umi.ui.checkValidEditSection':
          const haveValid = !!document.querySelectorAll('div.g_umiuiBlockAddEditMode').length;
          const frame = document.getElementById('umi-ui-bubble');
          if (frame && frame.contentWindow) {
            frame.contentWindow.postMessage(
              JSON.stringify({
                action: 'umi.ui.checkValidEditSection.success',
                payload: {
                  haveValid,
                },
              }),
              '*',
            );
          }
          break;
        case 'umi.ui.add-blocks-success':
          if(data && location.pathname !== 'data' && data !== '/') {
            location.href = data;
          }
          break;
        default:
          break;
      }
    } catch(e) {
    }
  }, false);
})();
  