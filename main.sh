#!/usr/bin/env bash
src="ECP-ExaGraph--vite"
out="$HOME/Logs/$src$1.log"
ulimit -s unlimited
printf "" > "$out"

# Load OpenMPI module
module load hpcx-2.7.0/hpcx-ompi

# Download vite
if [[ "$DOWNLOAD" != "0" ]]; then
  rm -rf $src
  git clone https://github.com/wolfram77/$src
  cd $src
fi

# Convert graph to binary format, run vite, and clean up
runVite() {
  stdbuf --output=L ./bin/fileConvert -m -w -f "$1" -o "$1.bin"                                     2>&1 | tee -a "$out"
  stdbuf --output=L mpiexec -np 1 --map-by node --bind-to none ./bin/graphClustering -i -f "$1.bin" 2>&1 | tee -a "$out"
  rm -rf "$1.bin"                                                                                        | tee -a "$out"
  stdbuf --output=L printf "\n\n"                                                                        | tee -a "$out"
}

# Build and run vite
make -j32

# Run vite on all graphs
runAll() {
  # runVite "$HOME/Data/web-Stanford.mtx"
  runVite "$HOME/Data/indochina-2004.mtx"
  runVite "$HOME/Data/uk-2002.mtx"
  runVite "$HOME/Data/arabic-2005.mtx"
  runVite "$HOME/Data/uk-2005.mtx"
  runVite "$HOME/Data/webbase-2001.mtx"
  runVite "$HOME/Data/it-2004.mtx"
  runVite "$HOME/Data/sk-2005.mtx"
  runVite "$HOME/Data/com-LiveJournal.mtx"
  runVite "$HOME/Data/com-Orkut.mtx"
  runVite "$HOME/Data/asia_osm.mtx"
  runVite "$HOME/Data/europe_osm.mtx"
  runVite "$HOME/Data/kmer_A2a.mtx"
  runVite "$HOME/Data/kmer_V1r.mtx"
}

# Run vite 5 times
for i in {1..5}; do
  runAll
done

# Signal completion
curl -X POST "https://maker.ifttt.com/trigger/puzzlef/with/key/${IFTTT_KEY}?value1=$src$1"
