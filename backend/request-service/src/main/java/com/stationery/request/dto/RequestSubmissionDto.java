package com.stationery.request.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/**
 * DTO for submitting a new stationery request.
 * Contains the list of items and quantities requested by the student.
 */
public class RequestSubmissionDto {

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<RequestItemDto> items;

    public List<RequestItemDto> getItems() { return items; }
    public void setItems(List<RequestItemDto> items) { this.items = items; }
}
