#!/bin/bash

PLUGIN_NAME="__PLUGIN_NAME__"
PLUGIN_VERSION="__PLUGIN_VERSION__"
PLUGIN_TYPE="__PLUGIN_TYPE__"
ADDON_DIR="${HOME}/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons"
TARGET_DIR="${ADDON_DIR}/${PLUGIN_NAME}_${PLUGIN_VERSION}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="${SCRIPT_DIR}/dist"

echo "========================================"
echo "  WPS LawTools v${PLUGIN_VERSION} 安装程序"
echo "========================================"
echo ""

if [ ! -d "$DIST_DIR" ] || [ ! -f "${DIST_DIR}/index.html" ]; then
  echo "❌ 错误: 未找到插件文件"
  echo "   请确保 dist 文件夹与此脚本在同一目录"
  echo ""
  read -p "按回车键退出..."
  exit 1
fi

if [ ! -d "${HOME}/Library/Containers/com.kingsoft.wpsoffice.mac" ]; then
  echo "❌ 未检测到 WPS Office，请先从 wps.cn 安装"
  echo ""
  read -p "按回车键退出..."
  exit 1
fi

echo "📍 安装路径: ${TARGET_DIR}"
echo ""

mkdir -p "$ADDON_DIR"

if [ -d "$TARGET_DIR" ]; then
  echo "🔄 检测到已有安装，正在更新..."
  rm -rf "$TARGET_DIR"
fi

cp -r "$DIST_DIR" "$TARGET_DIR"

if [ ! -f "${TARGET_DIR}/index.html" ]; then
  echo "❌ 安装失败: 文件复制出错"
  echo ""
  read -p "按回车键退出..."
  exit 1
fi

echo "✅ 插件文件复制成功"

PUBLISH_XML="${ADDON_DIR}/publish.xml"
PLUGIN_LINE="<jsplugin name=\"${PLUGIN_NAME}\" type=\"${PLUGIN_TYPE}\" url=\"${PLUGIN_NAME}_${PLUGIN_VERSION}\" version=\"${PLUGIN_VERSION}\" enable=\"enable_dev\" install=\"null\" customDomain=\"\"/>"

cat > "$PUBLISH_XML" << XMLEOF
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<jsplugins>
  ${PLUGIN_LINE}
</jsplugins>
XMLEOF

echo "✅ 插件注册信息已更新"
echo ""
echo "🎉 安装完成！请完全退出 WPS (Cmd+Q) 后重新打开"
echo ""
read -p "按回车键退出..."
