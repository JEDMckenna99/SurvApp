import re

# Fix all TypeScript errors systematically

fixes = [
    # FileUploader - useEffect already fixed
    
    # SignaturePad - remove unused Box
    ("frontend/src/components/common/SignaturePad.tsx", 
     r"import \{ useRef, useState \} from 'react'\nimport \{\n  Box,\n  Button,",
     "import { useRef, useState } from 'react'\nimport {\n  Button,"),
    
    # Payment page - these imports were already added, but let me verify
]

for file_path, old_pattern, new_text in fixes:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = re.sub(old_pattern, new_text, content)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"Fixed: {file_path}")
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")










