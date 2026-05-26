#!/bin/bash
PLUGIN_NAME="wps_lawtools"
PLUGIN_VERSION="1.2.0"
PLUGIN_TYPE="wps"
ADDON_DIR="${HOME}/.local/share/Kingsoft/wps/jsaddons"
TARGET_DIR="${ADDON_DIR}/${PLUGIN_NAME}_${PLUGIN_VERSION}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "======================================"
echo "  陈恒律师AI工具箱 - Linux 安装"
echo "  ${PLUGIN_NAME} v${PLUGIN_VERSION}"
echo "======================================"
echo ""

if [ "$(id -u)" -eq 0 ]; then
  echo -e "${RED}❌ 请勿使用 root 用户运行此脚本${NC}"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="${SCRIPT_DIR}/dist"

if [ ! -d "$DIST_DIR" ]; then
  echo -e "${RED}❌ 未找到 dist 目录，请先运行 npm run build${NC}"
  exit 1
fi

echo -e "${YELLOW}📁 安装目录: ${TARGET_DIR}${NC}"
echo ""

mkdir -p "$ADDON_DIR"

if [ -d "$TARGET_DIR" ]; then
  echo -e "${YELLOW}⚠️  检测到已安装版本，将覆盖更新${NC}"
  rm -rf "$TARGET_DIR"
fi

cp -r "$DIST_DIR" "$TARGET_DIR"
echo -e "${GREEN}✅ 文件复制完成${NC}"

PUBLISH_XML="${ADDON_DIR}/publish.xml"
PLUGIN_LINE="<jsplugin name=\"${PLUGIN_NAME}\" type=\"${PLUGIN_TYPE}\" url=\"${PLUGIN_NAME}_${PLUGIN_VERSION}\" version=\"${PLUGIN_VERSION}\" enable=\"enable_dev\" install=\"null\" customDomain=\"\"/>"

if [ -f "$PUBLISH_XML" ]; then
  if grep -q "name=\"${PLUGIN_NAME}\"" "$PUBLISH_XML"; then
    sed -i "s|<jsplugin name=\"${PLUGIN_NAME}\"[^/]*/>|${PLUGIN_LINE}|g" "$PUBLISH_XML"
    echo -e "${GREEN}✅ 已更新 publish.xml 中的插件注册信息${NC}"
  else
    sed -i "s|</jsplugins>|  ${PLUGIN_LINE}\n</jsplugins>|g" "$PUBLISH_XML"
    echo -e "${GREEN}✅ 已在 publish.xml 中追加插件注册信息${NC}"
  fi
else
  cat > "$PUBLISH_XML" << EOF
<jsplugins>
  ${PLUGIN_LINE}
</jsplugins>
EOF
  echo -e "${GREEN}✅ 已创建 publish.xml${NC}"
fi

echo ""
echo -e "${GREEN}======================================"
echo "  ✅ 安装成功！"
echo "======================================${NC}"
echo ""
echo "请重启 WPS Office 以加载插件。"
echo ""
echo "如需卸载，运行: ./uninstall_linux.sh"
echo ""
