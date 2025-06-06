#!/bin/bash

echo "🧹 Migration Scripts Cleanup Helper"
echo "=================================="
echo ""
echo "This script will help you archive old migration scripts."
echo "The following scripts will be KEPT:"
echo "  ✅ deploy-database-caprover.js"
echo "  ✅ deploy-database-structure.js"
echo "  ✅ export-database-structure.js"
echo "  ✅ README-MIGRATION.md"
echo ""
echo "The following scripts will be ARCHIVED:"
echo "  📦 All other migration-related scripts"
echo ""
read -p "Do you want to proceed? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    # Create archive directory
    mkdir -p scripts/archive-migration
    
    # List of scripts to keep
    keep_scripts=(
        "deploy-database-caprover.js"
        "deploy-database-structure.js"
        "export-database-structure.js"
        "README-MIGRATION.md"
        "cleanup-migration-scripts.sh"
    )
    
    # Move all other .js files to archive
    for file in scripts/*.js; do
        filename=$(basename "$file")
        
        # Check if this file should be kept
        should_keep=false
        for keep_file in "${keep_scripts[@]}"; do
            if [[ "$filename" == "$keep_file" ]]; then
                should_keep=true
                break
            fi
        done
        
        # Move to archive if not in keep list
        if [[ "$should_keep" == false ]]; then
            echo "  📦 Archiving: $filename"
            mv "$file" scripts/archive-migration/
        fi
    done
    
    echo ""
    echo "✅ Cleanup complete!"
    echo ""
    echo "📁 Archived scripts are in: scripts/archive-migration/"
    echo "💡 You can safely delete this directory after confirming everything works."
    echo ""
    echo "🚀 To deploy database structure to production, run:"
    echo "   pnpm db:deploy"
    echo ""
else
    echo "❌ Cleanup cancelled."
fi 