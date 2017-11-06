if [ -z "$1" ]; then
    echo "Please enter a release version"
    exit
fi

read -p "Future release is $1. Please press any key to confirm..."
github_changelog_generator -u pliablepixels -p zmNinja  --future-release $1
