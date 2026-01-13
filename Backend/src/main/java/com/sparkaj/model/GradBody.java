package com.sparkaj.model;

import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonProperty;

public class GradBody {
	@JsonProperty("grad")
    private String grad;
	
	public GradBody() {}
	
	public GradBody(String grad) {
        this.grad = grad;
    }

	public String getGrad() {
		return grad;
	}

	public void setGrad(String grad) {
		this.grad = grad;
	}

	@Override
	public int hashCode() {
		return Objects.hash(grad);
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		GradBody other = (GradBody) obj;
		return grad.equals(other.grad);
	}


}
