#!/bin/bash

PLUGIN_NAME="__PLUGIN_NAME__"
PLUGIN_VERSION="__PLUGIN_VERSION__"
PLUGIN_TYPE="__PLUGIN_TYPE__"
ADDON_DIR="${HOME}/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons"
TARGET_DIR="${ADDON_DIR}/${PLUGIN_NAME}_${PLUGIN_VERSION}"

SELF_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="${SELF_DIR}/../Resources/dist"

if [ ! -d "$DIST_DIR" ]; then
  osascript -e 'display dialog "安装文件缺失，请重新下载安装包。" buttons {"确定"} default button 1 with title "安装失败" with icon stop'
  exit 1
fi

WPS_PARENT="$(dirname "$(dirname "$(dirname "$ADDON_DIR")")")"
if [ ! -d "$WPS_PARENT" ]; then
  osascript -e 'display dialog "未检测到 WPS Office，请先安装 WPS。\n\n可从 wps.cn 下载。" buttons {"确定"} default button 1 with title "安装失败" with icon stop'
  exit 1
fi

RESULT=$(osascript -e "display dialog \"即将安装 ${PLUGIN_NAME} v${PLUGIN_VERSION}\\n\\n安装路径：${TARGET_DIR}\" buttons {\"取消\", \"安装\"} default button 2 with title \"安装 WPS LawTools\"" 2>/dev/null)

if [[ "$RESULT" != *"安装"* ]]; then
  exit 0
fi

mkdir -p "$ADDON_DIR"

if [ -d "$TARGET_DIR" ]; then
  rm -rf "$TARGET_DIR"
fi

cp -r "$DIST_DIR" "$TARGET_DIR"

PUBLISH_XML="${ADDON_DIR}/publish.xml"
PLUGIN_LINE="<jsplugin name=\"${PLUGIN_NAME}\" type=\"${PLUGIN_TYPE}\" url=\"${PLUGIN_NAME}_${PLUGIN_VERSION}\" version=\"${PLUGIN_VERSION}\" enable=\"enable_dev\" install=\"null\" customDomain=\"\"/>"

if [ -f "$PUBLISH_XML" ] && grep -q "name=\"${PLUGIN_NAME}\"" "$PUBLISH_XML"; then
  sed -i '' "s|<jsplugin name=\"${PLUGIN_NAME}\"[^/]*/>|${PLUGIN_LINE}|g" "$PUBLISH_XML"
elif [ -f "$PUBLISH_XML" ]; then
  awk -v line="  ${PLUGIN_LINE}" '/<jsplugins>/{print; print line; next}1' "$PUBLISH_XML" > "${PUBLISH_XML}.tmp" && mv "${PUBLISH_XML}.tmp" "$PUBLISH_XML"
else
  cat > "$PUBLISH_XML" << PLUGEOF
<jsplugins>
  ${PLUGIN_LINE}
</jsplugins>
PLUGEOF
fi

osascript -e 'display dialog "安装成功！\n\n请重启 WPS Office 以加载插件。" buttons {"好的"} default button 1 with title "安装完成"'

exit 0
