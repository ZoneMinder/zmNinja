if [ -z "$1" ]; then
    echo "Please enter a release version"
    exit
fi

orig=$1
VER="${orig/v/}"
read -p "Future release is v${VER}. Please press any key to confirm..."
github_changelog_generator -u pliablepixels -p zmNinja  --future-release v${VER}
