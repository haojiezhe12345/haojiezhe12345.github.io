import json
import os


def loadReplaceTxt(txtfile):
    txtdict = {}
    lines = '\n'
    with open(txtfile, encoding='utf-8') as f:
        lines = f.read().splitlines()
    for i in range(len(lines)):
        if lines[i] != '\n' and lines[i] != '' and lines[i + 1] != '\n' and lines[i + 1] != '':
            txtdict[lines[i]] = lines[i + 1]
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

for file in os.listdir(remoteDir):
    if (file.startswith('index')):
        copyAndReplace(file, remoteDir, replaceDict)
