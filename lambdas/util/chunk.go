package util

import "github.com/ojkelly/linnet/lambdas/util/types"

// ChunkNodes an array into smaller arrays
func ChunkNodes(array []types.Node, chunkSize int) (divided [][]types.Node) {
	for i := 0; i < len(array); i += chunkSize {
		end := i + chunkSize

		if end > len(array) {
			end = len(array)
		}

		divided = append(divided, array[i:end])
	}
	return
}

// ChunkStringArray an array into smaller arrays
func ChunkStringArray(array []string, chunkSize int) (divided [][]string) {
	for i := 0; i < len(array); i += chunkSize {
		end := i + chunkSize

		if end > len(array) {
			end = len(array)
		}

		divided = append(divided, array[i:end])
	}
	return
}
