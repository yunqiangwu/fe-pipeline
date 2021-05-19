// @ts-nocheck

    window.g_umi = {
      version: '3.4.20',
    };
  

    (() => {
      window.g_entries = [
        
      ];
      try {
        const ua = window.navigator.userAgent;
        const isIE = ua.indexOf('MSIE ') > -1 || ua.indexOf('Trident/') > -1;
        if (isIE) return;

        // Umi UI Bubble
        require('C:/Users/q2320/workspace/fe-pipeline/samples/hzero-app2/node_modules/hzero-cli-preset-ui/lib/bubble').default({
          port: 3358,
          path: 'C:/Users/q2320/workspace/fe-pipeline/samples/hzero-app2',
          currentProject: '',
          isBigfish: undefined,
        });
      } catch (e) {
        console.warn('Umi UI render error:', e);
      }
    })();
  