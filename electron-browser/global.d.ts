interface Window {
    require: (module: string) => any;
  }
  
  declare namespace JSX {
    interface IntrinsicElements {
      webview: any;
    }
  }