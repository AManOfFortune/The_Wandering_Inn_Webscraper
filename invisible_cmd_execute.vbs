Dim WshShell, filePath
Set WshShell = CreateObject("WScript.Shell") 
filePath = WshShell.CurrentDirectory & "\node_chrome_commands.bat"
WshShell.Run chr(34) & filePath & Chr(34), 0
Set WshShell = Nothing