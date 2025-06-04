import json
import os


def loadReplaceTxt(txtfile):
    txtdict = {}
    prev_line = ''
    with open(txtfile, encoding='utf-8') as f:
        for line in f.readlines():
            line = line.strip()
            if line and prev_line:
                txtdict[prev_line] = line
            prev_line = line
    return txtdict


def copyAndReplace(file, remoteDir, replaceDict):
    remoteFile = os.path.join(remoteDir, file)
    print(remoteFile)

    with open(remoteFile, encoding='utf-8', mode='r') as f:
        filetxt = f.read()
    
    for txt in replaceDict:
        filetxt = filetxt.replace(txt, replaceDict[txt])

    with open(file, encoding='utf-8', mode='w') as f:
        f.write(filetxt)


replaceDict = loadReplaceTxt('replace.txt')
print(json.dumps(replaceDict, indent=4))

remoteDir = R'Z:\Web\Dashboard0\madohomu'
# remoteDir = R'Z:\Web\apitest'

for file in os.listdir(remoteDir):
    if (file.startswith('index')):
        copyAndReplace(file, remoteDir, replaceDict)
