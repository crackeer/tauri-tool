import { IconHome, IconCodeSquare, IconScan, IconLiveBroadcast, IconHighlight, IconCloudDownload, IconQrcode } from '@arco-design/web-react/icon';

export default [
    { 'key': '/', 'icon': <IconHome />, 'title': '主页' },
    { 'key': '/json/create', 'icon': <IconCloudDownload />, 'title': 'JSON' },
    { 'key': '/web/tool', 'icon': <IconHighlight />, 'title': 'Web工具' },
    { 'key': '/web/qrcode', 'icon': <IconQrcode />, 'title': '二维码生成' },
    { 'key': '/http/web_static', 'icon': <IconLiveBroadcast />, 'title': '静态资源服务器' },
]