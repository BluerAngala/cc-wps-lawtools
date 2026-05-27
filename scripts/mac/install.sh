#!/bin/bash

PLUGIN_NAME="__PLUGIN_NAME__"
PLUGIN_VERSION="__PLUGIN_VERSION__"
PLUGIN_TYPE="__PLUGIN_TYPE__"
ADDON_DIR="${HOME}/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons"
TARGET_DIR="${ADDON_DIR}/${PLUGIN_NAME}_${PLUGIN_VERSION}"

SELF_DIR="$(cd "$(dirname "$0")" && pwd)"
RESOURCES_DIR="$(cd "${SELF_DIR}/../Resources" && pwd 2>/dev/null)"
DIST_DIR="${RESOURCES_DIR}/dist"

LOG_FILE="/tmp/wps_lawtools_install.log"
echo "=== 安装日志 $(date) ===" > "$LOG_FILE"
echo "SELF_DIR: $SELF_DIR" >> "$LOG_FILE"
echo "RESOURCES_DIR: $RESOURCES_DIR" >> "$LOG_FILE"
echo "DIST_DIR: $DIST_DIR" >> "$LOG_FILE"
echo "DIST_DIR exists: $(test -d "$DIST_DIR" && echo YES || echo NO)" >> "$LOG_FILE"

if [ ! -d "$DIST_DIR" ]; then
  echo "ERROR: DIST_DIR not found" >> "$LOG_FILE"
  osascript -e "display dialog \"安装文件缺失。\\n\\n详细信息请查看: /tmp/wps_lawtools_install.log\" buttons {\"确定\"} default button 1 with title \"安装失败\" with icon stop"
  exit 1
fi

echo "DIST_DIR contents: $(ls "$DIST_DIR")" >> "$LOG_FILE"

WPS_PARENT="$(dirname "$(dirname "$(dirname "$ADDON_DIR")")")"
if [ ! -d "$WPS_PARENT" ]; then
  echo "ERROR: WPS_PARENT not found: $WPS_PARENT" >> "$LOG_FILE"
  osascript -e 'display dialog "未检测到 WPS Office，请先安装 WPS。\n\n可从 wps.cn 下载。" buttons {"确定"} default button 1 with title "安装失败" with icon stop'
  exit 1
fi

RESULT=$(osascript -e "display dialog \"即将安装 ${PLUGIN_NAME} v${PLUGIN_VERSION}\\n\\n安装路径：${TARGET_DIR}\" buttons {\"取消\", \"安装\"} default button 2 with title \"安装 WPS LawTools\"" 2>/dev/null)

if [[ "$RESULT" != *"安装"* ]]; then
  echo "用户取消安装" >> "$LOG_FILE"
  exit 0
fi

echo "开始安装..." >> "$LOG_FILE"

# 生成临时安装脚本，用 osascript do shell script 执行
# 这样可以绕过 .app 沙盒限制，以用户身份运行
HELPER_SCRIPT="/tmp/wps_lawtools_helper.sh"

cat > "$HELPER_SCRIPT" << HELPEREOF
#!/bin/bash
mkdir -p "${ADDON_DIR}"
if [ -d "${TARGET_DIR}" ]; then
  rm -rf "${TARGET_DIR}"
fi
cp -r "${DIST_DIR}" "${TARGET_DIR}"
PUBLISH_XML="${ADDON_DIR}/publish.xml"
cat > "\$PUBLISH_XML" << 'XMLEOF'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<jsplugins>
  <jsplugin name="${PLUGIN_NAME}" type="${PLUGIN_TYPE}" url="${PLUGIN_NAME}_${PLUGIN_VERSION}" version="${PLUGIN_VERSION}" enable="enable_dev" install="null" customDomain=""/>
</jsplugins>
XMLEOF
HELPEREOF

chmod +x "$HELPER_SCRIPT"

echo "Helper script:" >> "$LOG_FILE"
cat "$HELPER_SCRIPT" >> "$LOG_FILE"

osascript_result=$(osascript -e "do shell script \"/bin/bash ${HELPER_SCRIPT}\"" 2>&1)
osascript_status=$?

echo "osascript exit: $osascript_status" >> "$LOG_FILE"
if [ -n "$osascript_result" ]; then
  echo "osascript output: $osascript_result" >> "$LOG_FILE"
fi

# 清理临时脚本
rm -f "$HELPER_SCRIPT"

# 验证复制结果
if [ ! -d "$TARGET_DIR" ] || [ ! -f "${TARGET_DIR}/index.html" ]; then
  echo "ERROR: 复制失败" >> "$LOG_FILE"
  echo "TARGET_DIR exists: $(test -d "$TARGET_DIR" && echo YES || echo NO)" >> "$LOG_FILE"
  echo "index.html exists: $(test -f "${TARGET_DIR}/index.html" && echo YES || echo NO)" >> "$LOG_FILE"
  osascript -e "display dialog \"文件复制失败。\\n\\n详细信息请查看: /tmp/wps_lawtools_install.log\" buttons {\"确定\"} default button 1 with title \"安装失败\" with icon stop"
  exit 1
fi

echo "文件复制成功: $(ls "$TARGET_DIR")" >> "$LOG_FILE"
echo "publish.xml 内容:" >> "$LOG_FILE"
cat "${ADDON_DIR}/publish.xml" >> "$LOG_FILE" 2>/dev/null
echo "安装完成" >> "$LOG_FILE"

osascript -e 'display dialog "安装成功！\n\n请重启 WPS Office 以加载插件。" buttons {"好的"} default button 1 with title "安装完成"'

exit 0
