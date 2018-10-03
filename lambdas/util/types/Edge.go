package types

// Edge connects two or more Nodes
type Edge struct {
	// Type where this edge is found
	TypeName string `json:"typeName"`

	// Field on typeName where this edge is found
	Field string `json:"field"`

	// Return Type of the field
	FieldType string `json:"fieldType"`

	// The name of the field used for mutation with ids
	EdgeName string `json:"edgeName"`

	// Whether or not the field is NonNull
	Required bool `json:"required"`

	Cardinality string `json:"cardinality"`

	// If the pricinple is true then
	// linnetedge === typeName.id
	// else
	// id === nestedItem.id
	Principal string `json:"principal"`

	// The vertex on the other side of the edge
	Counterpart EdgeCounterpart `json:"counterpart"`
}

// EdgeCounterpart is the Node on the other side of the Edge
type EdgeCounterpart struct {
	TypeName string `json:"typeName"`
	Field    string `json:"field"`
}

// EdgeCardinality indicates how if there are ONE or MANY connecting nodes
type EdgeCardinality int

const (
	// ONE connecting node
	ONE EdgeCardinality = iota
	// MANY connecting nodes
	MANY EdgeCardinality = iota
)

// EdgePrinciple indicates if the current Edge is the Principle/Primary Edge
// This is an internal type used to decide how to store the Edge
type EdgePrinciple int

const (
	// TRUE this is the principle edge
	TRUE EdgePrinciple = iota
	// FALSE this is NOT the principle edge
	FALSE EdgePrinciple = iota
)
