!include "MUI2.nsh"

!define PRODUCT_NAME "ChenHeng Lawyer AI Toolbox"
!define PRODUCT_NAME_EN "wps_lawtools"
!define PRODUCT_VERSION "1.2.0"
!define PRODUCT_PUBLISHER "ChenHeng Law Office"
!define PRODUCT_WEBITE "https://github.com"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME_EN}"

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "..\wps-addon-build\${PRODUCT_NAME_EN}_setup.exe"
InstallDir "$APPDATA\kingsoft\wps\jsaddons"
RequestExecutionLevel user
ShowInstDetails show

SetCompressor /SOLID lzma
SetCompressorDictSize 8

VIProductVersion "${PRODUCT_VERSION}.0"
VIAddVersionKey "ProductName" "${PRODUCT_NAME}"
VIAddVersionKey "ProductVersion" "${PRODUCT_VERSION}"
VIAddVersionKey "CompanyName" "${PRODUCT_PUBLISHER}"
VIAddVersionKey "LegalCopyright" "Copyright (C) ${PRODUCT_PUBLISHER}"
VIAddVersionKey "FileDescription" "${PRODUCT_NAME} Installer"
VIAddVersionKey "FileVersion" "${PRODUCT_VERSION}.0"
VIAddVersionKey "OriginalFilename" "${PRODUCT_NAME_EN}_setup.exe"

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

  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\${PRODUCT_NAME_EN}_${PRODUCT_VERSION}\uninstall.exe"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\${PRODUCT_NAME_EN}_${PRODUCT_VERSION}\uninstall.exe"
  WriteRegDWORD HKCU "${PRODUCT_UNINST_KEY}" "NoModify" 1
  WriteRegDWORD HKCU "${PRODUCT_UNINST_KEY}" "NoRepair" 1
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEBITE}"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\uninstall.exe"
  RMDir /r "$INSTDIR"
  Delete "$INSTDIR\..\publish.xml"

  DeleteRegKey HKCU "${PRODUCT_UNINST_KEY}"
SectionEnd
