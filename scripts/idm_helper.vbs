' IDM API Helper - VBScript wrapper for Internet Download Manager
' Arguments: URL, Referrer, Cookie, PostData, Username, Password, OutputPath, OutputFilename, UserAgent, Flags

Function Main()
    Dim url, referrer, cookie, postData, username, password
    Dim outputPath, outputFilename, userAgent, flags
    Dim idmPath, shell, command
    Dim success
    
    On Error Resume Next
    
    ' Get command line arguments
    Dim args
    Set args = WScript.Arguments
    
    If args.Count < 1 Then
        WScript.Echo "{""error"":""URL is required"",""success"":false}"
        WScript.Quit 1
    End If
    
    url = args(0)
    referrer = IIf(args.Count > 1, args(1), "")
    cookie = IIf(args.Count > 2, args(2), "")
    postData = IIf(args.Count > 3, args(3), "")
    username = IIf(args.Count > 4, args(4), "")
    password = IIf(args.Count > 5, args(5), "")
    outputPath = IIf(args.Count > 6, args(6), "")
    outputFilename = IIf(args.Count > 7, args(7), "")
    userAgent = IIf(args.Count > 8, args(8), "")
    flags = IIf(args.Count > 9, CInt(args(9)), 1)
    
    ' Find IDM installation path from registry
    Dim wshShell
    Set wshShell = CreateObject("WScript.Shell")
    
    idmPath = ""
    On Error Resume Next
    idmPath = wshShell.RegRead("HKEY_CLASSES_ROOT\IDMan.CIDMLinkTransmitter\CLSID\")
    If Err.Number <> 0 Or idmPath = "" Then
        Err.Clear
        ' Try default installation path
        idmPath = "C:\Program Files (x86)\Internet Download Manager\IDMan.exe"
        Dim fso
        Set fso = CreateObject("Scripting.FileSystemObject")
        If Not fso.FileExists(idmPath) Then
            idmPath = "C:\Program Files\Internet Download Manager\IDMan.exe"
            If Not fso.FileExists(idmPath) Then
                WScript.Echo "{""error"":""Internet Download Manager not found. Please install IDM first."",""success"":false}"
                WScript.Quit 1
            End If
        End If
    Else
        ' Get path from CLSID
        Dim clsidPath
        clsidPath = wshShell.RegRead("HKEY_CLASSES_ROOT\CLSID\" & idmPath & "\LocalServer32\")
        If Err.Number = 0 And clsidPath <> "" Then
            idmPath = Replace(clsidPath, Chr(34), "")
        Else
            idmPath = "C:\Program Files (x86)\Internet Download Manager\IDMan.exe"
        End If
    End If
    Err.Clear
    
    ' Build command line
    ' IDM command line: IDMan.exe /d URL [/p localpath] [/f filename] [/q] [/h headers] [/n]
    ' /d - download URL
    ' /f - save as filename
    ' /p - save to path  
    ' /q - quiet mode (add to queue without dialog)
    ' /n - start download immediately
    ' /a - add to queue but don't start
    command = Chr(34) & idmPath & Chr(34) & " /d " & Chr(34) & url & Chr(34)
    
    If outputFilename <> "" Then
        command = command & " /f " & Chr(34) & outputFilename & Chr(34)
    End If
    
    If outputPath <> "" Then
        command = command & " /p " & Chr(34) & outputPath & Chr(34)
    End If
    
    ' Add to queue silently
    command = command & " /n"
    
    ' Execute IDM
    On Error Resume Next
    wshShell.Run command, 0, False
    
    If Err.Number <> 0 Then
        WScript.Echo "{""error"":""" & EscapeJSON(Err.Description) & """,""success"":false}"
        WScript.Quit 1
    End If
    
    WScript.Echo "{""success"":true,""message"":""Download sent to IDM successfully""}"
    WScript.Quit 0
End Function

' Helper function to escape JSON special characters
Function EscapeJSON(str)
    Dim result
    result = str
    result = Replace(result, "\", "\\")
    result = Replace(result, """", "\""")
    result = Replace(result, Chr(13), "\r")
    result = Replace(result, Chr(10), "\n")
    result = Replace(result, Chr(9), "\t")
    EscapeJSON = result
End Function

' Run the main function
Main()
