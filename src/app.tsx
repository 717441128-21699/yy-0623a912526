import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { CustomerProvider } from './store/CustomerContext';
import './app.scss';

function App(props) {
  useEffect(() => {
    console.log('[App] 应用启动');
  }, []);

  useDidShow(() => {
    console.log('[App] 应用显示');
  });

  useDidHide(() => {
    console.log('[App] 应用隐藏');
  });

  return (
    <CustomerProvider>
      {props.children}
    </CustomerProvider>
  );
}

export default App;
