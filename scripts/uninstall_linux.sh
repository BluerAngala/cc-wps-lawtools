#!/bin/bash
PLUGIN_NAME="wps_lawtools"
PLUGIN_VERSION="1.2.0"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ADDON_DIR="${HOME}/.local/share/Kingsoft/wps/jsaddons"
TARGET_DIR="${ADDON_DIR}/${PLUGIN_NAME}_${PLUGIN_VERSION}"

echo ""
echo -e "${YELLOW}卸载 ${PLUGIN_NAME} v${PLUGIN_VERSION}...${NC}"

if [ ! -d "$TARGET_DIR" ]; then
  echo -e "${RED}❌ 未找到已安装的插件${NC}"
  exit 1
fi

rm -rf "$TARGET_DIR"
echo -e "${GREEN}✅ 已删除插件文件${NC}"

PUBLISH_XML="${ADDON_DIR}/publish.xml"
if [ -f "$PUBLISH_XML" ]; then
  sed -i "/name=\"${PLUGIN_NAME}\"/d" "$PUBLISH_XML"
  echo -e "${GREEN}✅ 已从 publish.xml 移除注册信息${NC}"
fi

echo ""
echo -e "${GREEN}✅ 卸载完成，请重启 WPS Office${NC}"
echo ""
