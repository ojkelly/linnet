// Code generated by "stringer -type=EdgeCardinality"; DO NOT EDIT.

package types

import "strconv"

const _EdgeCardinality_name = "ONEMANY"

var _EdgeCardinality_index = [...]uint8{0, 3, 7}

func (i EdgeCardinality) String() string {
	if i < 0 || i >= EdgeCardinality(len(_EdgeCardinality_index)-1) {
		return "EdgeCardinality(" + strconv.FormatInt(int64(i), 10) + ")"
	}
	return _EdgeCardinality_name[_EdgeCardinality_index[i]:_EdgeCardinality_index[i+1]]
}
