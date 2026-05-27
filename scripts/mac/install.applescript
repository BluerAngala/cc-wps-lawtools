set pluginName to "__PLUGIN_NAME__"
set pluginVersion to "__PLUGIN_VERSION__"

set homeDir to POSIX path of (path to home folder)
set addonDir to homeDir & "Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons"
set targetDir to addonDir & "/" & pluginName & "_" & pluginVersion

set appPath to POSIX path of (path to me)
if appPath ends with "/" then set appPath to text 1 thru -2 of appPath
set containerDir to do shell script "dirname " & quoted form of appPath
set distPath to containerDir & "/dist"
set publishPath to containerDir & "/publish.xml"

try
    do shell script "test -d " & quoted form of (homeDir & "Library/Containers/com.kingsoft.wpsoffice.mac")
on error
    display dialog "未检测到 WPS Office，请先安装 WPS。" & return & "可从 wps.cn 下载。" buttons {"确定"} default button 1 with title "安装失败" with icon stop
    return
end try

try
    do shell script "test -f " & quoted form of (distPath & "/index.html")
on error
    display dialog "未找到安装文件，请确保从 DMG 镜像中运行。" buttons {"确定"} default button 1 with title "安装失败" with icon stop
    return
end try

display dialog "即将安装 " & pluginName & " v" & pluginVersion buttons {"取消", "安装"} default button 2 with title "安装 WPS LawTools"

if button returned of result is "取消" then return

try
    set copyCmd to "mkdir -p " & quoted form of addonDir & " && if [ -d " & quoted form of targetDir & " ]; then rm -rf " & quoted form of targetDir & "; fi && cp -r " & quoted form of distPath & " " & quoted form of targetDir
    do shell script copyCmd with administrator privileges

    set publishCmd to "cp -f " & quoted form of publishPath & " " & quoted form of (addonDir & "/publish.xml")
    do shell script publishCmd with administrator privileges

    display dialog "安装成功！" & return & return & "请完全退出 WPS（⌘Q）后重新打开" buttons {"好的"} default button 1 with title "安装完成"
on error errMsg number errNum
    if errNum is -128 then return
    display dialog "安装失败：" & return & errMsg buttons {"确定"} default button 1 with title "安装失败" with icon stop
end try
