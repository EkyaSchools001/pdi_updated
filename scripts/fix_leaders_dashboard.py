
import os

target_file = r'c:\Users\HP\Desktop\ekya\school-growth-hub-main\src\pages\LeaderDashboard.tsx'
source_file = r'c:\Users\HP\Desktop\ekya\school-growth-hub-main\src\pages\ObserveView_new.tsx'

with open(target_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open(source_file, 'r', encoding='utf-8') as f:
    new_code = f.read()

# Lines to remove: 2540 to 2625 (1-based)
# Indices: 2539 to 2625 (exclusive of end index in slice notation?)
# lines[2539] is line 2540
# lines[2625] is line 2626 (AssignGoalView)

# So we want lines[:2539] + new_code + lines[2625:]

start_idx = 2539
end_idx = 2625 

# Verify we are cutting at the right place (optional check)
# print(lines[start_idx]) # Should be start of ObserveView
# print(lines[end_idx]) # Should be AssignGoalView or empty line before it

new_lines = lines[:start_idx] + [new_code + '\n\n'] + lines[end_idx:]

with open(target_file, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully spliced new ObserveView code.")
