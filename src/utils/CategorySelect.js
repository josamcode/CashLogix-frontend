// CategorySelect.jsx
import React from "react";
import CreatableSelect from "react-select/creatable";

const CategorySelect = ({
  categoriesFromUser,
  newCategory,
  setNewCategory,
}) => {
  const options = categoriesFromUser.map((cat) => ({
    value: cat,
    label: cat,
  }));

  const handleChange = (selectedOption) => {
    if (selectedOption) {
      setNewCategory(selectedOption.value);
    } else {
      setNewCategory("");
    }
  };

  return (
    <CreatableSelect
      isClearable
      onChange={handleChange}
      options={options}
      value={newCategory ? { label: newCategory, value: newCategory } : null}
      placeholder="Select or create a category"
      className="react-select-container"
      classNamePrefix="react-select"
    />
  );
};

export default CategorySelect;
