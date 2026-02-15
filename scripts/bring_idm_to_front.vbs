' Bring IDM window to front
' Uses Windows COM to find and activate the Internet Download Manager window

On Error Resume Next

Dim objShell, objWMI, colProcesses, objProcess, found
Dim strComputer

Set objShell = CreateObject("WScript.Shell")
Set objWMI = GetObject("winmgmts:")
strComputer = "."

' Find idman.exe process
Set colProcesses = objWMI.ExecQuery("Select * from Win32_Process where Name = 'idman.exe'")

found = False
For Each objProcess In colProcesses
    found = True
    Exit For
Next

If found Then
    ' Use AppActivate to bring IDM window to front
    ' First try to activate by window title containing "Internet Download Manager"
    On Error Resume Next
    objShell.AppActivate "Internet Download Manager"
    
    ' If that fails, try just "IDM"
    If Err.Number <> 0 Then
        objShell.AppActivate "IDM"
    End If
    
    ' If still fails, try exact process name
    If Err.Number <> 0 Then
        objShell.AppActivate "idman"
    End If
    
    ' Clear error and continue
    Err.Clear
End If

WScript.Quit 0
