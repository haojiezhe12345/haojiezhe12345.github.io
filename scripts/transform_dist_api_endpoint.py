import json
import os
import sys


base_url = 'https://haojiezhe12345.top:82/madohomu/'
if len(sys.argv) > 1:
    base_url = sys.argv[1]
    if not base_url.endswith('/'):
        base_url += '/'


def copyAndReplace(file, remoteDir, replaceDict):
    remoteFile = os.path.join(remoteDir, file)
    print(remoteFile)

    with open(remoteFile, encoding='utf-8', mode='r') as f:
        filetxt = f.read()

    for txt in replaceDict:
        filetxt = filetxt.replace(txt, replaceDict[txt])

    with open(remoteFile, encoding='utf-8', mode='w') as f:
        f.write(filetxt)


replaceDict = {
    'bg/': f'{base_url}bg/',
    'api/': f'{base_url}api/',
    'media/': f'{base_url}media/',
    'res/': f'{base_url}res/',
    '<!-- Insert base URL here -->': f'<script> window.baseUrl = "{base_url}" </script>',
    '"/madohomu"': '"/?no-redirect"',
    'vue2.js"': 'vue2.min.js"',
}
for key in replaceDict:
    print(f'{('"' + key + '"'):<{max([len(k) for k in replaceDict]) + 2}} -> "{replaceDict[key]}"')

remoteDir = R'../dist'

for file in os.listdir(remoteDir):
    if (file.startswith('index')):
        copyAndReplace(file, remoteDir, replaceDict)
