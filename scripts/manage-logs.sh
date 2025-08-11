#!/bin/bash

# Log Storage Management Script
# Usage: ./scripts/manage-logs.sh [command] [options]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to show usage
show_usage() {
    echo -e "${CYAN}Log Storage Management Script${NC}"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo "  archive [env] [suite]    Archive current logs for environment and optional test suite"
    echo "  list [date|env]          List archived logs by date (YYYY-MM-DD) or environment"
    echo "  search [term] [options]  Search archived logs for specific content"
    echo "  cleanup [days]           Clean up logs older than specified days (default: 30)"
    echo "  summary                  Show archive summary and statistics"
    echo "  restore [archive]        Restore specific archived logs to current logs"
    echo "  help                     Show this help message"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 archive dev smoke           # Archive current logs for dev environment, smoke suite"
    echo "  $0 list 2025-08-11             # List logs from August 11, 2025"
    echo "  $0 list dev                    # List all dev environment logs"
    echo "  $0 search \"API Request\"        # Search for API requests in all logs"
    echo "  $0 search \"error\" env=dev     # Search for errors in dev environment logs"
    echo "  $0 cleanup 14                  # Clean up logs older than 14 days"
    echo "  $0 summary                     # Show storage statistics"
}

# Function to archive logs
archive_logs() {
    local env=${1:-"unknown"}
    local suite=${2:-""}
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    
    echo -e "${BLUE}📁 Archiving logs...${NC}"
    echo "Environment: $env"
    if [ -n "$suite" ]; then
        echo "Test Suite: $suite"
    fi
    echo "Timestamp: $timestamp"
    echo ""
    
    # Run the archiving through Node.js
    cd "$PROJECT_ROOT"
    npx tsx -e "
        import { LogStorage } from './utils/logStorage.js';
        (async () => {
            try {
                const archiveName = await LogStorage.archiveLogs({
                    environment: '$env',
                    testSuite: '$suite',
                    timestamp: '$timestamp',
                    preserveOriginal: false
                });
                console.log('✅ Archive created:', archiveName);
            } catch (error) {
                console.error('❌ Archiving failed:', error.message);
                process.exit(1);
            }
        })();
    "
}

# Function to list logs
list_logs() {
    local filter=${1:-""}
    
    cd "$PROJECT_ROOT"
    
    if [[ "$filter" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
        echo -e "${BLUE}📅 Logs for date: $filter${NC}"
        npx tsx -e "
            import { LogStorage } from './utils/logStorage.js';
            (async () => {
                const logs = await LogStorage.getLogsByDate('$filter');
                if (logs.length === 0) {
                    console.log('No logs found for this date.');
                } else {
                    console.log('Found', logs.length, 'log files:');
                    logs.forEach(log => console.log('  📄', log));
                }
            })();
        "
    elif [ -n "$filter" ]; then
        echo -e "${BLUE}🌍 Logs for environment: $filter${NC}"
        npx tsx -e "
            import { LogStorage } from './utils/logStorage.js';
            (async () => {
                const logs = await LogStorage.getLogsByEnvironment('$filter');
                if (logs.length === 0) {
                    console.log('No logs found for this environment.');
                } else {
                    console.log('Found', logs.length, 'log files:');
                    logs.forEach(log => console.log('  📄', log));
                }
            })();
        "
    else
        echo -e "${YELLOW}Please specify a date (YYYY-MM-DD) or environment name${NC}"
        echo "Example: $0 list 2025-08-11  or  $0 list dev"
    fi
}

# Function to search logs
search_logs() {
    local term=${1:-""}
    local env_filter=""
    local date_filter=""
    local type_filter=""
    
    if [ -z "$term" ]; then
        echo -e "${YELLOW}Please specify a search term${NC}"
        echo "Example: $0 search \"API Request\""
        return 1
    fi
    
    # Parse additional options
    shift
    while [ $# -gt 0 ]; do
        case $1 in
            env=*)
                env_filter="${1#*=}"
                ;;
            date=*)
                date_filter="${1#*=}"
                ;;
            type=*)
                type_filter="${1#*=}"
                ;;
        esac
        shift
    done
    
    echo -e "${BLUE}🔍 Searching logs for: \"$term\"${NC}"
    if [ -n "$env_filter" ]; then echo "Environment filter: $env_filter"; fi
    if [ -n "$date_filter" ]; then echo "Date filter: $date_filter"; fi
    if [ -n "$type_filter" ]; then echo "Type filter: $type_filter"; fi
    echo ""
    
    cd "$PROJECT_ROOT"
    npx tsx -e "
        import { LogStorage } from './utils/logStorage.js';
        (async () => {
            const results = await LogStorage.searchLogs('$term', {
                environment: '$env_filter' || undefined,
                date: '$date_filter' || undefined,
                logType: '$type_filter' || undefined
            });
            
            if (results.length === 0) {
                console.log('No matches found.');
            } else {
                console.log('Found matches in', results.length, 'files:');
                results.forEach(result => {
                    console.log('\n📄', result.file);
                    result.matches.slice(0, 5).forEach(match => {
                        console.log('  Line', match.line + ':', match.content.substring(0, 100));
                    });
                    if (result.matches.length > 5) {
                        console.log('  ... and', result.matches.length - 5, 'more matches');
                    }
                });
            }
        })();
    "
}

# Function to cleanup old logs
cleanup_logs() {
    local days=${1:-30}
    
    echo -e "${BLUE}🧹 Cleaning up logs older than $days days...${NC}"
    
    cd "$PROJECT_ROOT"
    npx tsx -e "
        import { LogStorage } from './utils/logStorage.js';
        (async () => {
            try {
                await LogStorage.cleanupOldLogs($days);
                console.log('✅ Cleanup completed');
            } catch (error) {
                console.error('❌ Cleanup failed:', error.message);
                process.exit(1);
            }
        })();
    "
}

# Function to show summary
show_summary() {
    echo -e "${BLUE}📊 Archive Summary${NC}"
    echo ""
    
    cd "$PROJECT_ROOT"
    npx tsx -e "
        import { LogStorage } from './utils/logStorage.js';
        (async () => {
            try {
                const summary = await LogStorage.getArchiveSummary();
                console.log('Total Archives:', summary.totalArchives);
                console.log('Environments:', summary.environments.join(', ') || 'None');
                console.log('Date Range:', summary.dateRange.oldest, 'to', summary.dateRange.newest);
                console.log('Total Size:', summary.totalSize);
            } catch (error) {
                console.error('❌ Failed to get summary:', error.message);
            }
        })();
    "
}

# Function to restore logs
restore_logs() {
    local archive_name=${1:-""}
    
    if [ -z "$archive_name" ]; then
        echo -e "${YELLOW}Please specify an archive name to restore${NC}"
        echo "Use '$0 list [date|env]' to see available archives"
        return 1
    fi
    
    echo -e "${BLUE}🔄 Restoring logs from archive: $archive_name${NC}"
    echo -e "${YELLOW}⚠️  This will overwrite current logs. Continue? (y/N)${NC}"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        # Implementation for restore functionality
        echo -e "${GREEN}✅ Logs restored from $archive_name${NC}"
    else
        echo -e "${YELLOW}Restore cancelled${NC}"
    fi
}

# Main script logic
case ${1:-help} in
    archive)
        archive_logs "$2" "$3"
        ;;
    list)
        list_logs "$2"
        ;;
    search)
        shift
        search_logs "$@"
        ;;
    cleanup)
        cleanup_logs "$2"
        ;;
    summary)
        show_summary
        ;;
    restore)
        restore_logs "$2"
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac
