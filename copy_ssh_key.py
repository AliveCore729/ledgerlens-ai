import pexpect
import os
import sys

child = pexpect.spawn('ssh-copy-id -o StrictHostKeyChecking=no AliveCore@20.6.132.118')
child.logfile = sys.stdout.buffer

index = child.expect(['assword:', 'yes/no', pexpect.EOF])
if index == 1:
    child.sendline('yes')
    child.expect('assword:')
    child.sendline('Chikujain@15')
elif index == 0:
    child.sendline('Chikujain@15')

child.expect(pexpect.EOF)
