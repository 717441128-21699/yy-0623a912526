export default defineAppConfig({
  pages: [
    'pages/today/index',
    'pages/capture/index',
    'pages/confirm/index',
    'pages/compare/index',
    'pages/pending/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#4A90E2',
    navigationBarTitleText: '轻医美照片归档',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#4A90E2',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/today/index',
        text: '今日到店'
      },
      {
        pagePath: 'pages/capture/index',
        text: '拍照指引'
      },
      {
        pagePath: 'pages/confirm/index',
        text: '客户确认'
      },
      {
        pagePath: 'pages/compare/index',
        text: '对比预览'
      },
      {
        pagePath: 'pages/pending/index',
        text: '待补资料'
      }
    ]
  }
})
