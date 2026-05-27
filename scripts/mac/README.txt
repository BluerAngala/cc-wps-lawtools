WPS LawTools - macOS 安装说明
================================

安装步骤：

1. 双击 wps_lawtools_mac.zip 解压
2. 双击 "安装LawTools.command"
   - 首次使用可能提示权限不足，请在终端执行：
     chmod +x 安装LawTools.command
   - 然后再双击运行
3. 终端会显示安装进度，完成后完全退出 WPS (Cmd+Q)
4. 重新打开 WPS 即可在功能区看到插件

常见问题
--------

Q: 双击 .command 没反应或提示权限不足
A: 打开终端，执行 chmod +x 安装LawTools.command 后再双击

Q: 安装后 WPS 中看不到插件
A: 请完全退出 WPS（Command+Q）后重新打开

Q: 如何卸载
A: 删除目录 ~/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons/__PLUGIN_NAME_____PLUGIN_VERSION__/
   然后重启 WPS
