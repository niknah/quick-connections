
ffmpeg -y -i "$1" -filter_complex "[0:v]fps=10,split[a][b];[b]palettegen[p];[a][p]paletteuse,setpts=0.5*PTS[v]" -map '[v]' "$2"

