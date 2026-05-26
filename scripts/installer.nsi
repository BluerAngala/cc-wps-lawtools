!include "MUI2.nsh"

!define PRODUCT_NAME "ChenHeng Lawyer AI Toolbox"
!define PRODUCT_NAME_EN "wps_lawtools"
!define PRODUCT_VERSION "1.2.0"

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "..\wps-addon-build\${PRODUCT_NAME_EN}_setup.exe"
InstallDir "$APPDATA\kingsoft\wps\jsaddons"
RequestExecutionLevel user
ShowInstDetails show

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"

Section "MainSection" SEC01
  SetOutPath "$INSTDIR\${PRODUCT_NAME_EN}_${PRODUCT_VERSION}"
  SetOverwrite on

  File /r "..\dist\*.*"

  SetOutPath "$INSTDIR"
  File "publish.xml"
SectionEnd

Section -Post
  WriteUninstaller "$INSTDIR\${PRODUCT_NAME_EN}_${PRODUCT_VERSION}\uninstall.exe"
SectionEnd

Section "Uninstall"
  RMDir /r "$INSTDIR\${PRODUCT_NAME_EN}_${PRODUCT_VERSION}"
  Delete "$INSTDIR\publish.xml"
SectionEnd
